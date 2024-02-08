package com.i4mz.ippo2.domain.library.controller;


import com.i4mz.ippo2.domain.books.dto.StoryBookDto;
import com.i4mz.ippo2.domain.books.entity.StoryBook;
import com.i4mz.ippo2.domain.library.service.LibraryService;
import com.i4mz.ippo2.domain.user.entity.Children;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/book")
public class LibraryController {

    /* 생성자 주입*/
    private final LibraryService libraryService;


    public LibraryController(LibraryService libraryService) {
        this.libraryService = libraryService;
    }

    @GetMapping("/myLibrary")
    public ResponseEntity<List<StoryBook>> getAllMyLibrary() {
        return ResponseEntity.ok(libraryService.getAllMyLibrary());
    }

}
