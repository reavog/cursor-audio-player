package com.audioplayer.project.service;

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
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlaylistService {

  public static final int MAX_PLAYLISTS_PER_USER = 50;

  private final PlaylistRepository playlistRepository;
  private final PlaylistSongRepository playlistSongRepository;
  private final SongsRepository songsRepository;
  private final UserRepository userRepository;
  private final SongMapper songMapper;

  public PlaylistService(
      PlaylistRepository playlistRepository,
      PlaylistSongRepository playlistSongRepository,
      SongsRepository songsRepository,
      UserRepository userRepository,
      SongMapper songMapper) {
    this.playlistRepository = playlistRepository;
    this.playlistSongRepository = playlistSongRepository;
    this.songsRepository = songsRepository;
    this.userRepository = userRepository;
    this.songMapper = songMapper;
  }

  @Transactional
  public PlaylistDTO create(String username, CreatePlaylistRequest request) {
    User user = requireUser(username);
    long count = playlistRepository.countByUserId(user.getId());
    if (count >= MAX_PLAYLISTS_PER_USER) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "You can create at most " + MAX_PLAYLISTS_PER_USER + " playlists");
    }

    Playlist playlist = playlistRepository.save(new Playlist(user, request.name().trim()));
    return toDto(playlist, List.of(), false);
  }

  @Transactional(readOnly = true)
  public List<PlaylistDTO> list(String username) {
    User user = requireUser(username);
    return playlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(
            playlist -> {
              List<PlaylistSong> entries =
                  playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId());
              return toDto(playlist, entries, false);
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public PlaylistDTO get(String username, UUID playlistId) {
    Playlist playlist = requireOwnedPlaylist(username, playlistId);
    List<PlaylistSong> entries =
        playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId());
    return toDto(playlist, entries, true);
  }

  @Transactional
  public PlaylistDTO rename(String username, UUID playlistId, RenamePlaylistRequest request) {
    Playlist playlist = requireOwnedPlaylist(username, playlistId);
    playlist.setName(request.name().trim());
    Playlist saved = playlistRepository.save(playlist);
    List<PlaylistSong> entries =
        playlistSongRepository.findByPlaylistIdOrderByPositionAsc(saved.getId());
    return toDto(saved, entries, true);
  }

  @Transactional
  public PlaylistDTO addSong(String username, UUID playlistId, AddSongToPlaylistRequest request) {
    Playlist playlist = requireOwnedPlaylist(username, playlistId);
    Songs song =
        songsRepository
            .findById(request.songId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Song not found"));

    if (playlistSongRepository.existsByPlaylistIdAndSongId(playlist.getId(), song.getId())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Song is already in this playlist");
    }

    int nextPosition = playlistSongRepository.findMaxPositionByPlaylistId(playlist.getId()) + 1;
    playlistSongRepository.save(new PlaylistSong(playlist, song, nextPosition));

    List<PlaylistSong> entries =
        playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId());
    return toDto(playlist, entries, true);
  }

  @Transactional(readOnly = true)
  public List<SongsDTO> listSongs(String username, UUID playlistId) {
    Playlist playlist = requireOwnedPlaylist(username, playlistId);
    return playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId()).stream()
        .map(entry -> songMapper.toDto(entry.getSong()))
        .toList();
  }

  private User requireUser(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private Playlist requireOwnedPlaylist(String username, UUID playlistId) {
    User user = requireUser(username);
    return playlistRepository
        .findByIdAndUserId(playlistId, user.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Playlist not found"));
  }

  private PlaylistDTO toDto(Playlist playlist, List<PlaylistSong> entries, boolean includeSongs) {
    int totalDuration =
        entries.stream().mapToInt(entry -> entry.getSong().getDuration()).sum();
    List<SongsDTO> songs =
        includeSongs
            ? entries.stream().map(entry -> songMapper.toDto(entry.getSong())).toList()
            : List.of();

    return new PlaylistDTO(
        playlist.getId(),
        playlist.getName(),
        playlist.getUser().getUsername(),
        playlist.getCreatedAt(),
        entries.size(),
        totalDuration,
        songs);
  }
}
