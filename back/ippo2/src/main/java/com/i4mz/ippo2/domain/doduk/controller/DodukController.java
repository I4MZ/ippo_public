package com.i4mz.ippo2.domain.doduk.controller;

import com.i4mz.ippo2.domain.books.dto.StoryBookDto;
import com.i4mz.ippo2.domain.books.entity.StoryBook;
import com.i4mz.ippo2.domain.doduk.dto.DodukDto;
import com.i4mz.ippo2.domain.doduk.dto.DodukResponseDto;
import com.i4mz.ippo2.domain.doduk.service.DodukService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/book/doduk")
public class DodukController {
    
    /* 생성자 주입*/
    private final DodukService dodukService;

    public DodukController(DodukService dodukService) {
        this.dodukService = dodukService;
    }


    @PostMapping("/registStoryBook")
    public ResponseEntity<DodukResponseDto> registStoryBook(@RequestBody StoryBookDto storyBookDto){

        log.info("스토리북 세팅 테스트");
        Integer childId = 1;

        StoryBook storyBook = dodukService.registStoryBook(childId, storyBookDto);
        return ResponseEntity.ok().body(new DodukResponseDto(HttpStatus.OK, "스토리북 생성 성공", storyBook.getBookId()));
    }

    @PostMapping("/saveStoryToRedis")
    public ResponseEntity<?> saveStoryToRedis(@RequestBody DodukDto dodukDto) {
        dodukService.saveStoryToRedis(dodukDto.getBookId(), dodukDto.getStoryNum(), dodukDto.getStoryContents());

        log.info("Redis DB 저장 ---------------------");
        log.info("Redis getBookId : " + dodukDto.getBookId());
        log.info("Redis getStoryNum : " + dodukDto.getStoryNum());
        log.info("Redis getStoryContents : " + dodukDto.getStoryContents());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{bookId}/story/{storyNum}")
    public ResponseEntity<String> getStoryFromRedis(@PathVariable Long bookId, @PathVariable Long storyNum) {
        String story = dodukService.getStoryToRedis(bookId, storyNum);
        return ResponseEntity.ok(story);
    }

    @GetMapping("/{bookId}/replay/{storyNum}")
    public ResponseEntity<DodukResponseDto> getReplay(@PathVariable Long bookId, @PathVariable Long storyNum) {
        DodukDto dodukDto = dodukService.getReplay(bookId, storyNum);
        return ResponseEntity.ok(new DodukResponseDto(HttpStatus.OK, "리플레이 조회 성공", dodukDto));
    }


    @PostMapping("/saveStory")
    public ResponseEntity<DodukResponseDto> saveStory(@RequestBody DodukDto dodukDto){
        dodukService.saveStory(dodukDto);

        return ResponseEntity.ok().body(new DodukResponseDto(HttpStatus.OK, "스토리 저장 성공", dodukDto.getStoryNum()));

    }
}