package com.i4mz.ippo2.domain.library.service;

import com.i4mz.ippo2.domain.books.dto.StoryBookDto;
import com.i4mz.ippo2.domain.books.entity.StoryBook;
import com.i4mz.ippo2.domain.library.repository.LibraryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LibraryService {

    private final LibraryRepository libraryRepository;

    public LibraryService(LibraryRepository libraryRepository) {
        this.libraryRepository = libraryRepository;
    }



    public List<StoryBook> getAllMyLibrary() {
        Long childId = 1L; // 하드코딩된 childId
        return libraryRepository.findByChildId_childId(childId);
    }


}

