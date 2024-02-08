package com.i4mz.ippo2.domain.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdatedDto {
    @Size(max = 15, message = "전화번호는 15자를 초과할 수 없습니다.")
    private String phoneNum;
}
