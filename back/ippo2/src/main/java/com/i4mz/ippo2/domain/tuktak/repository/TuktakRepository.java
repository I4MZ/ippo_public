package com.i4mz.ippo2.domain.tuktak.repository;

import com.i4mz.ippo2.domain.tuktak.entity.TuktakEntity;
import com.i4mz.ippo2.domain.tuktak.entity.TuktakId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TuktakRepository extends JpaRepository<TuktakEntity, TuktakId> {

    // 작가명으로 모든 동화책을 검색하는 메서드를 추가합니다.
    List<TuktakEntity> findByAuthor(String author);

}