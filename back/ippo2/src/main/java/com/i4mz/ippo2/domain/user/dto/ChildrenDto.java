package com.i4mz.ippo2.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChildrenDto {
    @NotBlank(message = "아동 이름은 필수입니다.")
    private String childName;

    @NotNull(message = "생일은 필수입니다.")
    @Past(message = "아동의 생일은 과거 날짜여야 합니다.")
    private LocalDateTime childBirthDate;

    @NotBlank(message = "성별은 필수입니다.")
    private String gender;
}
