package com.audioplayer.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.audioplayer.project.mapper.SongMapper;
import com.audioplayer.project.model.AddSongToPlaylistRequest;
import com.audioplayer.project.model.CreatePlaylistRequest;
import com.audioplayer.project.model.Playlist;
import com.audioplayer.project.model.PlaylistDTO;
import com.audioplayer.project.model.PlaylistSong;
import com.audioplayer.project.model.RenamePlaylistRequest;
import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsDTO;
import com.audioplayer.project.model.User;
import com.audioplayer.project.repo.PlaylistRepository;
import com.audioplayer.project.repo.PlaylistSongRepository;
import com.audioplayer.project.repo.SongsRepository;
import com.audioplayer.project.repo.UserRepository;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

  @Mock private PlaylistRepository playlistRepository;
  @Mock private PlaylistSongRepository playlistSongRepository;
  @Mock private SongsRepository songsRepository;
  @Mock private UserRepository userRepository;
  @Mock private SongMapper songMapper;

  private PlaylistService playlistService;
  private User user;
  private UUID userId;

  @BeforeEach
  void setUp() throws Exception {
    playlistService =
        new PlaylistService(
            playlistRepository,
            playlistSongRepository,
            songsRepository,
            userRepository,
            songMapper);

    userId = UUID.randomUUID();
    user = new User();
    user.setUsername("miguel");
    user.setEmail("miguel@example.com");
    user.setPasswordHash("hash");
    setField(user, "id", userId);
  }

  @Test
  void createRejectsWhenUserAlreadyHasFiftyPlaylists() {
    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.countByUserId(userId)).thenReturn(50L);

    ResponseStatusException exception =
        assertThrows(
            ResponseStatusException.class,
            () -> playlistService.create("miguel", new CreatePlaylistRequest("Late Night")));

    assertEquals(400, exception.getStatusCode().value());
    assertTrue(exception.getReason().contains("50"));
    verify(playlistRepository, never()).save(any());
  }

  @Test
  void createPersistsPlaylistForOwner() throws Exception {
    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.countByUserId(userId)).thenReturn(2L);

    Playlist saved = new Playlist(user, "Focus");
    setField(saved, "id", UUID.randomUUID());
    setField(saved, "createdAt", LocalDateTime.of(2026, 7, 29, 12, 0));
    when(playlistRepository.save(any(Playlist.class))).thenReturn(saved);

    PlaylistDTO dto = playlistService.create("miguel", new CreatePlaylistRequest("Focus"));

    assertEquals("Focus", dto.name());
    assertEquals("miguel", dto.creatorUsername());
    assertEquals(0, dto.songCount());
    assertEquals(0, dto.totalDurationSeconds());
  }

  @Test
  void renameUpdatesOwnedPlaylistName() throws Exception {
    Playlist playlist = new Playlist(user, "Old Name");
    UUID playlistId = UUID.randomUUID();
    setField(playlist, "id", playlistId);
    setField(playlist, "createdAt", LocalDateTime.of(2026, 7, 1, 9, 0));

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
    when(playlistRepository.save(playlist)).thenReturn(playlist);
    when(playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId)).thenReturn(List.of());

    PlaylistDTO dto =
        playlistService.rename("miguel", playlistId, new RenamePlaylistRequest("New Name"));

    assertEquals("New Name", dto.name());
    assertEquals("New Name", playlist.getName());
  }

  @Test
  void getReturnsNotFoundForOtherUsersPlaylist() {
    UUID playlistId = UUID.randomUUID();
    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.empty());

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> playlistService.get("miguel", playlistId));

    assertEquals(404, exception.getStatusCode().value());
  }

  @Test
  void addSongAppendsSongAndUpdatesTotals() throws Exception {
    Playlist playlist = new Playlist(user, "Workout");
    UUID playlistId = UUID.randomUUID();
    setField(playlist, "id", playlistId);
    setField(playlist, "createdAt", LocalDateTime.of(2026, 7, 10, 8, 0));

    UUID songId = UUID.randomUUID();
    Songs song = new Songs(songId, "Run", "Artist", "Album", 180, "/tmp/run.mp3");
    SongsDTO songDto = new SongsDTO(songId, "Run", "Artist", "Album", 180);
    PlaylistSong entry = new PlaylistSong(playlist, song, 0);

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
    when(songsRepository.findById(songId)).thenReturn(Optional.of(song));
    when(playlistSongRepository.existsByPlaylistIdAndSongId(playlistId, songId)).thenReturn(false);
    when(playlistSongRepository.findMaxPositionByPlaylistId(playlistId)).thenReturn(-1);
    when(playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId))
        .thenReturn(List.of(entry));
    when(songMapper.toDto(song)).thenReturn(songDto);

    PlaylistDTO dto =
        playlistService.addSong("miguel", playlistId, new AddSongToPlaylistRequest(songId));

    ArgumentCaptor<PlaylistSong> captor = ArgumentCaptor.forClass(PlaylistSong.class);
    verify(playlistSongRepository).save(captor.capture());
    assertEquals(0, captor.getValue().getPosition());
    assertEquals(1, dto.songCount());
    assertEquals(180, dto.totalDurationSeconds());
    assertEquals(1, dto.songs().size());
  }

  @Test
  void addSongRejectsDuplicates() throws Exception {
    Playlist playlist = new Playlist(user, "Chill");
    UUID playlistId = UUID.randomUUID();
    setField(playlist, "id", playlistId);

    UUID songId = UUID.randomUUID();
    Songs song = new Songs(songId, "Soft", "Artist", "Album", 120, "/tmp/soft.mp3");

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
    when(songsRepository.findById(songId)).thenReturn(Optional.of(song));
    when(playlistSongRepository.existsByPlaylistIdAndSongId(playlistId, songId)).thenReturn(true);

    ResponseStatusException exception =
        assertThrows(
            ResponseStatusException.class,
            () -> playlistService.addSong("miguel", playlistId, new AddSongToPlaylistRequest(songId)));

    assertEquals(409, exception.getStatusCode().value());
    verify(playlistSongRepository, never()).save(any());
  }

  @Test
  void removeSongDeletesOnlyJoinEntryAndRefreshesTotals() throws Exception {
    Playlist playlist = new Playlist(user, "Road Trip");
    UUID playlistId = UUID.randomUUID();
    setField(playlist, "id", playlistId);
    setField(playlist, "createdAt", LocalDateTime.of(2026, 7, 20, 10, 0));

    UUID removedSongId = UUID.randomUUID();
    Songs removedSong =
        new Songs(removedSongId, "First", "Artist", "Album", 180, "/tmp/first.mp3");
    PlaylistSong removedEntry = new PlaylistSong(playlist, removedSong, 0);

    UUID remainingSongId = UUID.randomUUID();
    Songs remainingSong =
        new Songs(remainingSongId, "Second", "Artist", "Album", 240, "/tmp/second.mp3");
    PlaylistSong remainingEntry = new PlaylistSong(playlist, remainingSong, 1);
    SongsDTO remainingDto =
        new SongsDTO(remainingSongId, "Second", "Artist", "Album", 240);

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
    when(playlistSongRepository.findByPlaylistIdAndSongId(playlistId, removedSongId))
        .thenReturn(Optional.of(removedEntry));
    when(playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId))
        .thenReturn(List.of(remainingEntry));
    when(songMapper.toDto(remainingSong)).thenReturn(remainingDto);

    PlaylistDTO dto = playlistService.removeSong("miguel", playlistId, removedSongId);

    verify(playlistSongRepository).delete(removedEntry);
    verify(playlistSongRepository).flush();
    verify(songsRepository, never()).delete(any());
    assertEquals(1, dto.songCount());
    assertEquals(240, dto.totalDurationSeconds());
    assertEquals(List.of(remainingDto), dto.songs());
  }

  @Test
  void removeSongRejectsSongNotInPlaylist() throws Exception {
    Playlist playlist = new Playlist(user, "Focus");
    UUID playlistId = UUID.randomUUID();
    UUID songId = UUID.randomUUID();
    setField(playlist, "id", playlistId);

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
    when(playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId))
        .thenReturn(Optional.empty());

    ResponseStatusException exception =
        assertThrows(
            ResponseStatusException.class,
            () -> playlistService.removeSong("miguel", playlistId, songId));

    assertEquals(404, exception.getStatusCode().value());
    assertEquals("Song is not in this playlist", exception.getReason());
    verify(playlistSongRepository, never()).delete(any());
  }

  @Test
  void removeSongRejectsPlaylistOwnedByAnotherUser() {
    UUID playlistId = UUID.randomUUID();
    UUID songId = UUID.randomUUID();

    when(userRepository.findByUsername("miguel")).thenReturn(Optional.of(user));
    when(playlistRepository.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.empty());

    ResponseStatusException exception =
        assertThrows(
            ResponseStatusException.class,
            () -> playlistService.removeSong("miguel", playlistId, songId));

    assertEquals(404, exception.getStatusCode().value());
    verify(playlistSongRepository, never()).findByPlaylistIdAndSongId(any(), any());
    verify(playlistSongRepository, never()).delete(any());
  }

  private static void setField(Object target, String name, Object value) throws Exception {
    Field field = target.getClass().getDeclaredField(name);
    field.setAccessible(true);
    field.set(target, value);
  }
}
