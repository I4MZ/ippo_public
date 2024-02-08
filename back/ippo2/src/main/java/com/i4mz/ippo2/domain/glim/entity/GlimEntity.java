package com.i4mz.ippo2.domain.glim.entity;

import com.i4mz.ippo2.domain.books.entity.StoryBook;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "glim_contents")
@Data
public class GlimEntity {

    @Id
    @Column(name = "book_id")
    private Integer bookId;

    @MapsId // This annotation tells JPA to use the bookId as both PK and FK
    @OneToOne
    @JoinColumn(name = "book_id", referencedColumnName = "book_id")
    private StoryBook storyBook;

    @Column(name = "writer_contents", nullable = false, columnDefinition = "json") // Assuming your DB supports JSON column type.
    private String writerContents;

    @Column(name = "check_done", nullable = false)
    private Boolean checkDone = false;

    @Column(name = "er_data", columnDefinition = "TEXT")
    private String erData;

    @Column(name = "result_data")
    private Integer resultData;
}
