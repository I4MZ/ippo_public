package com.i4mz.ippo2.domain.user.entity;

/*
Entity: 데이터베이스의 테이블과 매핑되는 객체로, JPA (Java Persistence API)를 사용하여 관계형 데이터베이스에 저장되는 데이터를 표현합니다.
Entity는 비즈니스 데이터를 포함하며, 데이터의 영속성을 관리하는 역할을 합니다.
 */

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Builder
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @Column(name = "user_email")
    private String userEmail;

    /*
    @CreationTimestamp는 Hibernate가 제공하는 어노테이션으로, 엔티티가 저장될 때 현재 시간을 자동으로 할당합니다.
     */
    @CreationTimestamp
    @Column(name = "user_date", nullable = false)
    private LocalDateTime userDate;

    // nullable = true => null이 가능하다! default 설정
    @Column(name = "phone_num")
    private String phoneNum;

    @Column(name = "auth_token", nullable = false)
    private String authToken;

    @Column(name = "auth_domain", nullable = false)
    private String authDomain;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Children> children;
}
