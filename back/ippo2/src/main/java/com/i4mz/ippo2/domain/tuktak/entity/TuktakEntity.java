package com.i4mz.ippo2.domain.tuktak.entity;


import com.i4mz.ippo2.domain.books.entity.StoryBook;
import lombok.*;
import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.OffsetDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "tuktak_books")
public class TuktakEntity {

    @EmbeddedId
    private TuktakId Id;

    @ManyToOne
    @JoinColumn(name = "book_id", insertable = false, updatable = false)
    private StoryBook storyBook;

    @Column(name = "author")
    private String author;

    @Column(name = "saved_content", columnDefinition = "TEXT")
    private String savedcontent;

    @Column(name = "creating_date")
    private OffsetDateTime creatingDate;

    @Column(name = "full_content", columnDefinition = "TEXT")
    private String fullcontent;

    @Column(name = "completion_date")
    private OffsetDateTime completionDate;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl; // 챕터 이미지 URL
    
    @Builder.Default
    @Column(name = "is_active")
    private Integer isActive = 0;

}
