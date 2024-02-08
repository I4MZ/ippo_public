package com.i4mz.ippo2.domain.doduk.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DodukDto {


    private Long bookId;

    private String place;

    private Long storyNum;

    private String storyContents;

    private String storyImgUrl;
}
