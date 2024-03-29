package com.i4mz.ippo2.domain.books.repository;

import com.i4mz.ippo2.domain.books.entity.BookType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookTypeRepository extends JpaRepository<BookType, Long> {

}

