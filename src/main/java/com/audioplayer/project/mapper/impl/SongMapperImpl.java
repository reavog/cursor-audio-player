package com.audioplayer.project.mapper.impl;

import com.audioplayer.project.mapper.SongMapper;
import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsDTO;
import org.springframework.stereotype.Component;

@Component
public class SongMapperImpl implements SongMapper {

  @Override
  public SongsDTO toDto(Songs song) {
    return new SongsDTO(
        song.getId(), song.getTitle(), song.getArtist(), song.getAlbum(), song.getDuration());
  }
}
