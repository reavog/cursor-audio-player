package com.audioplayer.project.controller;

import com.audioplayer.project.mapper.SongMapper;
import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsPageDTO;
import com.audioplayer.project.repo.SongsRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class MusicController {

  private static final int MAX_PAGE_SIZE = 100;
  private static final int MAX_QUERY_LENGTH = 100;

  private final SongsRepository songsRepository;
  private final SongMapper songMapper;

  public MusicController(SongsRepository songsRepository, SongMapper songMapper) {
    this.songsRepository = songsRepository;
    this.songMapper = songMapper;
  }

  @GetMapping("/")
  public String home() {
    return "index";
  }

  @GetMapping("/api/songs/{id}/stream")
  public ResponseEntity<Resource> stream(@PathVariable UUID id) {
    Songs song = songsRepository.getReferenceById(id);
    FileSystemResource file = new FileSystemResource(song.getLocation());
    return ResponseEntity.ok().header(HttpHeaders.CONTENT_TYPE, "audio/mpeg").body(file);
  }

  @GetMapping("/api/songs")
  public SongsPageDTO getSongs(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size) {
    validatePage(page, size);

    String query = q.trim().toLowerCase(Locale.ROOT);
    if (query.length() > MAX_QUERY_LENGTH) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Search queries must be " + MAX_QUERY_LENGTH + " characters or fewer.");
    }

    PageRequest pageable =
        PageRequest.of(
            page,
            size,
            Sort.by(Sort.Order.asc("title").ignoreCase(), Sort.Order.asc("id")));
    Page<Songs> songs;

    if (query.isBlank()) {
      songs = songsRepository.findAll(pageable);
    } else {
      String escapedQuery = escapeLikePattern(query);
      songs =
          songsRepository.search(
              query, "%" + escapedQuery + "%", escapedQuery + "%", pageable);
    }

    return new SongsPageDTO(
        songs.getContent().stream().map(songMapper::toDto).toList(),
        songs.getNumber(),
        songs.getSize(),
        songs.getTotalElements(),
        songs.getTotalPages(),
        songs.isFirst(),
        songs.isLast());
  }

  private static void validatePage(int page, int size) {
    if (page < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must not be negative.");
    }

    if (size < 1 || size > MAX_PAGE_SIZE) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Page size must be between 1 and " + MAX_PAGE_SIZE + ".");
    }
  }

  private static String escapeLikePattern(String value) {
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
  }
}
