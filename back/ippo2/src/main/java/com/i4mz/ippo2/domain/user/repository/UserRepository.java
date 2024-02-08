package com.i4mz.ippo2.domain.user.repository;

/*
Repository: Entity 객체들의 컬렉션에 대한 접근을 추상화하는 계층입니다.
데이터베이스와의 모든 상호 작용을 캡슐화하고, 데이터를 검색하거나 저장하는 메소드를 제공합니다.
Spring Data JPA를 사용하면 인터페이스만 정의하고, Spring이 구현체를 자동으로 생성해 줍니다.
 */

import com.i4mz.ippo2.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findUserByUserEmail(String userEmail);
}
