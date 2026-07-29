package com.audioplayer.project.mapper.impl;

import com.audioplayer.project.mapper.UserMapper;
import com.audioplayer.project.model.User;
import com.audioplayer.project.model.UserDTO;

public class UserMapperImpl implements UserMapper {

  @Override
  public UserDTO toDto(User user) {
    return new UserDTO(user.getId(), user.getUsername(), user.getEmail());
  }
}
