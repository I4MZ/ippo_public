package com.i4mz.ippo2.domain.books.entity;

import com.i4mz.ippo2.domain.user.entity.Children;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;

import java.sql.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamicInsert
@Table(name = "story_book")
public class StoryBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Long bookId;

    @ManyToOne
    @JoinColumn(name = "book_type_id")
    private BookType bookTypeId;

    @Column(name = "book_img_url")
    private String bookImgUrl;

    @Column(name = "book_title")
    private String bookTitle;

    @Column(name = "create_date")
    private Date createDate;

    @Column(name = "modify_date")
    private Date modifyDate;

    @ManyToOne
    @JoinColumn(name = "child_id")
    private Children childId;


}
