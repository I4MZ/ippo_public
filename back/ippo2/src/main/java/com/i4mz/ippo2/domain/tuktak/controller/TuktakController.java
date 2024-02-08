package com.i4mz.ippo2.domain.tuktak.controller;

import com.i4mz.ippo2.domain.tuktak.dto.TuktakDto;
import com.i4mz.ippo2.domain.tuktak.dto.TuktakResponseDto;
import com.i4mz.ippo2.domain.tuktak.entity.TuktakId;
import com.i4mz.ippo2.domain.tuktak.service.TuktakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/book/tuktak")
public class TuktakController {
    private final TuktakService tuktakService;


    //동화 생성
    @PostMapping("/tuktak_book")
    public ResponseEntity<TuktakResponseDto> createTuktak(@Valid @RequestBody TuktakDto tuktakDto) {
        TuktakId createdId = tuktakService.createTuktak(tuktakDto);
        return ResponseEntity.ok().body(new TuktakResponseDto(HttpStatus.OK, "스토리북 생성 성공", createdId));
    }

    //동화 수정
    @PutMapping("/{bookId}/{storyNum}")
    public ResponseEntity<TuktakDto> updateTuktak(@PathVariable Long bookId, @PathVariable Long storyNum, @Valid @RequestBody TuktakDto tuktakDto) {
        TuktakId tuktakId = new TuktakId(bookId, storyNum);
        TuktakDto updatedDto = tuktakService.updateTuktak(tuktakId, tuktakDto);
        return Optional.ofNullable(updatedDto)
                .map(dto -> ResponseEntity.ok(dto))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //동화 삭제
    @DeleteMapping("/{bookId}/{storyNum}")
    public ResponseEntity<String> deleteTuktak(@PathVariable Long bookId, @PathVariable Long storyNum) {
        TuktakId tuktakId = new TuktakId(bookId, storyNum);
        tuktakService.deleteTuktak(tuktakId);
        return ResponseEntity.ok("동화책이 성공적으로 삭제되었습니다.");
    }

    // 작가명으로 작가가 생성한 모든 동화책을 검색하는 API 엔드포인트
    @GetMapping("/search")
    public ResponseEntity<List<TuktakDto>> findTuktaksByAuthor(@RequestParam String author) {
        List<TuktakDto> tuktaks = tuktakService.findTuktaksByAuthor(author);
        if (tuktaks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tuktaks);
    }

    // ID를 이용해 특정 동화책 정보를 가져오는 엔드포인트
    @GetMapping("/tuktak_books/{bookId}/{storyNum}")
    public ResponseEntity<TuktakDto> getTuktakById(@PathVariable Long bookId, @PathVariable Long storyNum) {
        return tuktakService.findTuktakById(bookId, storyNum)
                .map(ResponseEntity::ok) // 동화책을 찾은 경우 200 OK와 함께 반환
                .orElseGet(() -> ResponseEntity.notFound().build()); // 동화책을 찾지 못한 경우 404 Not Found
    }

}