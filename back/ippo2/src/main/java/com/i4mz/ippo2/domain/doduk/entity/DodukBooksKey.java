package com.i4mz.ippo2.domain.doduk.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
public class DodukBooksKey implements Serializable {

    @Column(name = "book_id")
    private Long bookId;

    @Column(name = "story_num")
    private Long storyNum;

}