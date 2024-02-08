package com.i4mz.ippo2.domain.books.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamicInsert
@Table(name = "book_type")
public class BookType {

    @Id
    @Column(name = "book_type_id")
    private Long bookTypeId;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "book_title")
    private String bookTitle;




}
