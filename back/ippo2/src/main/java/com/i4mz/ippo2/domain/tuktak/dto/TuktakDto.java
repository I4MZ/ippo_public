package com.i4mz.ippo2.domain.tuktak.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TuktakDto {

    private Long bookId; // StoryBook의 ID

    private String author; // 동화책의 작가를 저장(작사는 아이들)

    @NotEmpty(message = "콘텐츠는 비워둘 수 없습니다.")
    private String savedcontent; // 동화책의 내용을 저장(나의 도서관)

    @PastOrPresent(message = "게시 날짜는 현재여야합니다. 단, 변경되지 않습니다.")
    private OffsetDateTime creatingDate;

    @NotEmpty(message = "콘텐츠는 비워둘 수 없습니다.")
    private String fullcontent;

    @PastOrPresent(message = "게시 날짜는 과거 또는 현재여야 합니다.")
    private OffsetDateTime completionDate;

    private String imageUrl;

    @Builder.Default
    private Integer isActive = 0; // 동화책의 활성 여부를 저장

    private Long storyNum;
}