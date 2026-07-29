package com.audioplayer.project.repo;

import com.audioplayer.project.model.Songs;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// JPA automatically gives CRUD operations
public interface SongsRepository extends JpaRepository<Songs, UUID> {

  @Query(
      value =
          """
          SELECT s.*
          FROM songs s
          WHERE
            LOWER(
              COALESCE(s.title, '') || ' ' ||
              COALESCE(s.artist, '') || ' ' ||
              COALESCE(s.album, '')
            ) %> :query
            OR LOWER(
              COALESCE(s.title, '') || ' ' ||
              COALESCE(s.artist, '') || ' ' ||
              COALESCE(s.album, '')
            ) LIKE :likePattern ESCAPE E'\\\\'
          ORDER BY
            CASE
              WHEN LOWER(s.title) = :query THEN 0
              WHEN LOWER(s.title) LIKE :prefixPattern ESCAPE E'\\\\' THEN 1
              WHEN LOWER(s.title) LIKE :likePattern ESCAPE E'\\\\' THEN 2
              ELSE 3
            END,
            GREATEST(
              SIMILARITY(
                LOWER(
                  COALESCE(s.title, '') || ' ' ||
                  COALESCE(s.artist, '') || ' ' ||
                  COALESCE(s.album, '')
                ),
                :query
              ),
              WORD_SIMILARITY(
                :query,
                LOWER(
                  COALESCE(s.title, '') || ' ' ||
                  COALESCE(s.artist, '') || ' ' ||
                  COALESCE(s.album, '')
                )
              )
            ) DESC,
            LOWER(s.title),
            s.id
          """,
      countQuery =
          """
          SELECT COUNT(*)
          FROM songs s
          WHERE
            LOWER(
              COALESCE(s.title, '') || ' ' ||
              COALESCE(s.artist, '') || ' ' ||
              COALESCE(s.album, '')
            ) %> :query
            OR LOWER(
              COALESCE(s.title, '') || ' ' ||
              COALESCE(s.artist, '') || ' ' ||
              COALESCE(s.album, '')
            ) LIKE :likePattern ESCAPE E'\\\\'
          """,
      nativeQuery = true)
  Page<Songs> search(
      @Param("query") String query,
      @Param("likePattern") String likePattern,
      @Param("prefixPattern") String prefixPattern,
      Pageable pageable);
}
