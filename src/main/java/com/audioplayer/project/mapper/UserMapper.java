package com.audioplayer.project.mapper;

import com.audioplayer.project.model.User;
import com.audioplayer.project.model.UserDTO;

public interface UserMapper {
  UserDTO toDto(User user);
}
