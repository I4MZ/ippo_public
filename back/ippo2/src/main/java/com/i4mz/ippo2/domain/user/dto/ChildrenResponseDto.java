package com.i4mz.ippo2.domain.user.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChildrenResponseDto {
    private String childName;
    private LocalDateTime childBirthDate;
    private String gender;
}
