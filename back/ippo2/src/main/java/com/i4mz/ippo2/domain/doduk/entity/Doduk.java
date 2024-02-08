package com.i4mz.ippo2.domain.doduk.entity;

import com.i4mz.ippo2.domain.books.entity.StoryBook;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamicInsert
@Table(name = "doduk_books")
public class Doduk {

    //복합키로 설정한 book_id와 story_num
    @EmbeddedId
    private DodukBooksKey id;

    //insertable = false, updatable = false
    //이 필드가 관계를 위해서만 존재하며, 직접 삽입하거나 업데이트되지 않는다는 뜻
    //book_id의 엔티티 관계만 체크하기 위한 용도. 실질적으론 DodukBooksKey에 들가서 써야함
    @ManyToOne
    @JoinColumn(name = "book_id", insertable = false, updatable = false)
    private StoryBook storyBook;

    @Column(name = "place")
    private String place;

    @Column(name = "story_contents")
    private String storyContents;

    @Column(name = "story_img_url")
    private String storyImgUrl;

}
