package com.i4mz.ippo2.domain.books.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoryBookDto {

    private Long bookId;

    private Long bookTypeId;

    private String bookImgUrl;

    private String bookTitle;

    private Date createDate;

    private Date modifyDate;

    private Long childId;


}
