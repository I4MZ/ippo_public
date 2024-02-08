package com.i4mz.ippo2.domain.library.repository;

import com.i4mz.ippo2.domain.books.entity.StoryBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LibraryRepository extends JpaRepository<StoryBook, Long> {
    List<StoryBook> findByChildId_childId(Long childId);
}