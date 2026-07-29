package com.audioplayer.project.controller;

import com.audioplayer.project.model.AddSongToPlaylistRequest;
import com.audioplayer.project.model.CreatePlaylistRequest;
import com.audioplayer.project.model.PlaylistDTO;
import com.audioplayer.project.model.RenamePlaylistRequest;
import com.audioplayer.project.model.SongsDTO;
import com.audioplayer.project.service.PlaylistService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

  private final PlaylistService playlistService;

  public PlaylistController(PlaylistService playlistService) {
    this.playlistService = playlistService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PlaylistDTO create(
      Principal principal, @Valid @RequestBody CreatePlaylistRequest request) {
    return playlistService.create(principal.getName(), request);
  }

  @GetMapping
  public List<PlaylistDTO> list(Principal principal) {
    return playlistService.list(principal.getName());
  }

  @GetMapping("/{id}")
  public PlaylistDTO get(Principal principal, @PathVariable UUID id) {
    return playlistService.get(principal.getName(), id);
  }

  @PatchMapping("/{id}")
  public PlaylistDTO rename(
      Principal principal,
      @PathVariable UUID id,
      @Valid @RequestBody RenamePlaylistRequest request) {
    return playlistService.rename(principal.getName(), id, request);
  }

  @PostMapping("/{id}/songs")
  public PlaylistDTO addSong(
      Principal principal,
      @PathVariable UUID id,
      @Valid @RequestBody AddSongToPlaylistRequest request) {
    return playlistService.addSong(principal.getName(), id, request);
  }

  @GetMapping("/{id}/songs")
  public List<SongsDTO> listSongs(Principal principal, @PathVariable UUID id) {
    return playlistService.listSongs(principal.getName(), id);
  }
}
