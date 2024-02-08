package com.i4mz.ippo2.domain.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@Table(name = "children")
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Children {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "child_id", nullable = false)
    private Integer childId;

    /*
    @ManyToOne 어노테이션은 Children 엔티티가 User 엔티티에 대해 다대일 관계를 가지고 있음을 나타냅니다.
    fetch = FetchType.LAZY는 Children 엔티티를 로드할 때 관련 User 엔티티를 즉시 로드하지 않고, 실제로 참조할 때만 로드하도록 지정합니다.
    referencedColumnName 속성은 외래키가 참조하는 대상 엔티티의 컬럼을 지정합니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "user_email")
    @JsonIgnore
    private User user;

    @Column(name = "child_name", nullable = false)
    private String childName;

    @Column(name = "child_birth_date", nullable = false)
    private LocalDateTime childBirthDate;

    @Column(name = "gender", nullable = false)
    private String gender;

    public Children(Integer childId) {
    }
}
