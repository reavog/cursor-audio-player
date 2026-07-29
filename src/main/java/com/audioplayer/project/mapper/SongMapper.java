package com.audioplayer.project.mapper;

import com.audioplayer.project.model.Songs;
import com.audioplayer.project.model.SongsDTO;

public interface SongMapper {
  SongsDTO toDto(Songs songs);
}
