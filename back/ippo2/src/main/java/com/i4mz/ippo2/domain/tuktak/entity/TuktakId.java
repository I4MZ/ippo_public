package com.i4mz.ippo2.domain.tuktak.entity;

import jakarta.persistence.Column;
import lombok.*;
import java.io.Serializable;
import jakarta.persistence.Embeddable;

@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
public class TuktakId implements Serializable {

    @Column(name = "book_id")
    private Long bookId;

    @Column(name = "story_num")
    private Long storyNum;

}