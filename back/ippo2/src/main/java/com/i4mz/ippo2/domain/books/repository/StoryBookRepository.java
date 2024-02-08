package com.i4mz.ippo2.domain.books.repository;

import com.i4mz.ippo2.domain.books.entity.StoryBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryBookRepository extends JpaRepository<StoryBook, Long> {
}
