package com.audioplayer.project;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.audioplayer.project.controller.MusicController;
import com.audioplayer.project.mapper.SongMapper;
import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsDTO;
import com.audioplayer.project.model.SongsPageDTO;
import com.audioplayer.project.repo.SongsRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

class MusicControllerTest {

  private SongsRepository songsRepository;
  private SongMapper songMapper;
  private MusicController controller;

  @BeforeEach
  void setUp() {
    songsRepository = mock(SongsRepository.class);
    songMapper = mock(SongMapper.class);
    controller = new MusicController(songsRepository, songMapper);
  }

  @Test
  void blankQueryReturnsTheRequestedCatalogPage() {
    UUID id = UUID.randomUUID();
    Songs song = new Songs(id, "A Song", "An Artist", "An Album", 185, "/music/a.mp3");
    SongsDTO dto = new SongsDTO(id, "A Song", "An Artist", "An Album", 185);
    Pageable pageable = PageRequest.of(1, 10);
    Page<Songs> page = new PageImpl<>(List.of(song), pageable, 21);
    when(songsRepository.findAll(any(Pageable.class))).thenReturn(page);
    when(songMapper.toDto(song)).thenReturn(dto);

    SongsPageDTO result = controller.getSongs("   ", 1, 10);

    assertEquals(List.of(dto), result.content());
    assertEquals(1, result.page());
    assertEquals(10, result.size());
    assertEquals(21, result.totalElements());
    assertEquals(3, result.totalPages());
    verify(songsRepository).findAll(any(Pageable.class));
  }

  @Test
  void searchNormalizesTheQueryAndEscapesLikeWildcards() {
    when(songsRepository.search(
            eq("beat_ls%"), eq("%beat\\_ls\\%%"), eq("beat\\_ls\\%%"), any(Pageable.class)))
        .thenReturn(Page.empty(PageRequest.of(0, 25)));

    SongsPageDTO result = controller.getSongs("  BEAT_LS%  ", 0, 25);

    assertEquals(List.of(), result.content());
    assertEquals(0, result.totalElements());
    verify(songsRepository)
        .search(
            eq("beat_ls%"),
            eq("%beat\\_ls\\%%"),
            eq("beat\\_ls\\%%"),
            any(Pageable.class));
  }

  @Test
  void invalidPaginationIsRejectedBeforeQueryingTheRepository() {
    assertThrows(ResponseStatusException.class, () -> controller.getSongs("", -1, 25));
    assertThrows(ResponseStatusException.class, () -> controller.getSongs("", 0, 0));
    assertThrows(ResponseStatusException.class, () -> controller.getSongs("", 0, 101));

    verifyNoInteractions(songsRepository);
  }

  @Test
  void overlyLongSearchIsRejectedBeforeQueryingTheRepository() {
    assertThrows(
        ResponseStatusException.class, () -> controller.getSongs("a".repeat(101), 0, 25));

    verifyNoInteractions(songsRepository);
  }
}
