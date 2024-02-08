package com.i4mz.ippo2.domain.tuktak.service;

import com.i4mz.ippo2.domain.books.entity.StoryBook;
import com.i4mz.ippo2.domain.books.repository.StoryBookRepository;
import com.i4mz.ippo2.domain.tuktak.dto.TuktakDto;
import com.i4mz.ippo2.domain.tuktak.entity.TuktakEntity;
import com.i4mz.ippo2.domain.tuktak.entity.TuktakId;
import com.i4mz.ippo2.domain.tuktak.repository.TuktakRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Slf4j
@Service
public class TuktakService {
    private final TuktakRepository tuktakRepository;
    private final StoryBookRepository storyBookRepository;
    @Autowired
    public  TuktakService(TuktakRepository tuktakRepository, StoryBookRepository storyBookRepository) {
        this.tuktakRepository = tuktakRepository;
        this.storyBookRepository = storyBookRepository; // 초기화
    }

    // 동화책을 생성하는 메서드
    @Transactional
    public TuktakId createTuktak(TuktakDto dto) {
        TuktakEntity entity = convertToEntity(dto);
        StoryBook storyBook = storyBookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("StoryBook not found with id: " + dto.getBookId()));
        entity.setStoryBook(storyBook);
        TuktakEntity savedEntity = tuktakRepository.save(entity);

        return savedEntity.getId();
    }

    // 동화책을 삭제하는 메서드
    @Transactional
    public void deleteTuktak(TuktakId tuktakId) {
        tuktakRepository.deleteById(tuktakId);
    }

    //동화책을 수정하는 메서드
    @Transactional
    public TuktakDto updateTuktak(TuktakId tuktakId, TuktakDto dto) {
        TuktakEntity entity = tuktakRepository.findById(tuktakId)
                .orElseThrow(() -> new EntityNotFoundException("Tuktak not found with id: " + tuktakId));

        // Ensure that the fullcontent field is set correctly from the DTO
        entity.setAuthor(dto.getAuthor());
        entity.setSavedcontent(dto.getSavedcontent());
        entity.setFullcontent(dto.getFullcontent()); // Set fullcontent from the DTO
        entity.setImageUrl(dto.getImageUrl());

        entity = tuktakRepository.save(entity);
        return convertToDto(entity);
    }

    // 작가명으로 동화책을 검색하는 메서드
    @Transactional(readOnly = true)
    public List<TuktakDto> findTuktaksByAuthor(String author) {
        List<TuktakEntity> tuktakEntities = tuktakRepository.findByAuthor(author);
        return tuktakEntities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ID로 특정 동화책을 검색하는 서비스 메서드
    public Optional<TuktakDto> findTuktakById(Long bookId, Long storyNum) {
        TuktakId tuktakId = new TuktakId(bookId, storyNum); // 복합 키 생성
        return tuktakRepository.findById(tuktakId)
                .map(this::convertToDto); // TuktakEntity를 TuktakDto로 변환
    }

    // TuktakEntity를 TuktakDto로 변환하는 메서드
    private TuktakDto convertToDto(TuktakEntity entity) {
        TuktakDto dto = new TuktakDto();
        dto.setBookId(entity.getId().getBookId()); // 복합 키의 bookId를 설정
        dto.setStoryNum(entity.getId().getStoryNum()); // 복합 키의 storyNum를 설정
        dto.setAuthor(entity.getAuthor());
        dto.setSavedcontent(entity.getSavedcontent());
        dto.setFullcontent(entity.getFullcontent());
        dto.setCreatingDate(entity.getCreatingDate());
        dto.setCompletionDate(entity.getCompletionDate());
        dto.setImageUrl(entity.getImageUrl());
        return dto;
    }

    private TuktakEntity convertToEntity(TuktakDto dto) {
        TuktakEntity entity = new TuktakEntity();
        TuktakId tuktakId = new TuktakId(dto.getBookId(), dto.getStoryNum()); // 복합 키 생성
        entity.setId(tuktakId); // 복합 키 설정
        entity.setAuthor(dto.getAuthor());
        entity.setSavedcontent(dto.getSavedcontent());
        entity.setFullcontent(dto.getFullcontent());
        entity.setCreatingDate(dto.getCreatingDate());
        entity.setCompletionDate(dto.getCompletionDate());
        entity.setImageUrl(dto.getImageUrl());
        return entity;
    }
}
