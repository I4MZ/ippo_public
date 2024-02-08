package com.i4mz.ippo2.domain.doduk.service;

import com.i4mz.ippo2.domain.books.dto.StoryBookDto;
import com.i4mz.ippo2.domain.books.entity.BookType;
import com.i4mz.ippo2.domain.books.entity.StoryBook;
import com.i4mz.ippo2.domain.books.repository.BookTypeRepository;
import com.i4mz.ippo2.domain.books.repository.StoryBookRepository;
import com.i4mz.ippo2.domain.doduk.dto.DodukDto;
import com.i4mz.ippo2.domain.doduk.entity.Doduk;
import com.i4mz.ippo2.domain.doduk.entity.DodukBooksKey;
import com.i4mz.ippo2.domain.doduk.repository.DodukRepository;
import com.i4mz.ippo2.domain.user.entity.Children;
import com.i4mz.ippo2.domain.user.repository.ChildrenRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class DodukService {

    private final DodukRepository dodukRepository;
    private final BookTypeRepository bookTypeRepository;

    private final StoryBookRepository storyBookRepository;

    private final ChildrenRepository childrenRepository;

    private final RedisTemplate<String, String> redisTemplate;


    public DodukService(DodukRepository dodukRepository, BookTypeRepository bookTypeRepository,
                        StoryBookRepository storyBookRepository, ChildrenRepository childrenRepository,
                        RedisTemplate<String, String> redisTemplate) {
        this.dodukRepository = dodukRepository;
        this.bookTypeRepository = bookTypeRepository;
        this.storyBookRepository = storyBookRepository;
        this.childrenRepository = childrenRepository;
        this.redisTemplate = redisTemplate;

    }


    @Transactional
    public StoryBook registStoryBook(Integer childId, StoryBookDto storyBookDto) {


        BookType bookType = bookTypeRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("BookType with id 1 not found"));
        Children child = childrenRepository.findById(childId)
                .orElseThrow(() -> new EntityNotFoundException("Child with id " + childId + " not found"));



        /* Storybook row 생성 */
        StoryBook storyBook = new StoryBook();
        storyBook.setBookTypeId(bookType);
        storyBook.setChildId(child);
        storyBook.setBookTitle(storyBookDto.getBookTitle());
        storyBook.setBookImgUrl(storyBookDto.getBookImgUrl());


        log.info("[DodukService] 스토리북 저장 시작 ==========");



        return storyBookRepository.save(storyBook);
    }

    @Transactional
    public void saveStoryToRedis(Long bookId, Long storyNum, String storyContents){
        String key = "story:" + bookId + ":" + storyNum;
        redisTemplate.opsForValue().set(key, storyContents, 30, TimeUnit.MINUTES);
    }

    public String getStoryToRedis(Long bookId, Long storyNum) {
        String key = "story:" + bookId + ":" + storyNum;
        return redisTemplate.opsForValue().get(key);
    }

    public void saveStory(DodukDto dodukDto) {
        Doduk doduk = new Doduk();

        // 복합키 생성
        DodukBooksKey id = new DodukBooksKey(dodukDto.getBookId(), dodukDto.getStoryNum());
        doduk.setId(id);

        // 연관된 StoryBook 엔터티를 찾거나, 필요하다면 새로 생성합니다.
        // 예시에서는 단순히 참조만 설정하고 있습니다.
        // 실제로는 storyBookRepository 또는 다른 방법을 통해 StoryBook 엔터티를 가져와야 할 수도 있습니다.
        doduk.setStoryContents(dodukDto.getStoryContents());
        doduk.setStoryImgUrl(dodukDto.getStoryImgUrl());
        doduk.setPlace(dodukDto.getPlace());

        // 데이터 저장
        dodukRepository.save(doduk);
    }

    public DodukDto getReplay(Long bookId, Long storyNum) {
        DodukBooksKey dodukBooksKey = new DodukBooksKey(bookId, storyNum);
        Doduk doduk = dodukRepository.findById(dodukBooksKey)
                .orElseThrow(() -> new EntityNotFoundException("Doduk not found"));
        DodukDto dodukDto = new DodukDto();
        dodukDto.setStoryContents(doduk.getStoryContents());
        dodukDto.setStoryImgUrl(doduk.getStoryImgUrl());

        return dodukDto;
    }




}
