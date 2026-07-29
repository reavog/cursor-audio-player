package com.audioplayer.project.controller;

import com.audioplayer.project.mapper.SongMapper;
import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsDTO;
import com.audioplayer.project.repo.SongsRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MusicController {

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
  @ResponseBody
  public List<SongsDTO> getAllSongs() {
    return songsRepository.findAll().stream().map(songMapper::toDto).collect(Collectors.toList());
  }
}
