package com.i4mz.ippo2.domain.books.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookTypeDto {

    private Long bookTypeId;

    private String thumbnailUrl;

    private String bookTitle;



}
