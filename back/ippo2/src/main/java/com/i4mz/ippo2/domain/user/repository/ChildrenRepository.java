package com.i4mz.ippo2.domain.user.repository;
import com.i4mz.ippo2.domain.user.entity.Children;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChildrenRepository extends JpaRepository<Children, Integer> {
    // 특정 User의 이메일을 기준으로 Children을 조회하는 메서드
    List<Children> findByUser_UserEmail(String userEmail);
}

