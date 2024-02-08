package com.i4mz.ippo2.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegistrationDto {
    @Email(message = "이메일 형식이 유효하지 않습니다.")
    private String userEmail;

    @Size(max = 15, message = "전화번호는 15자를 초과할 수 없습니다.")
    private String phoneNum;

    @NotBlank(message = "인증 토큰은 필수입니다.")
    private String authToken;

    @NotBlank(message = "인증 도메인은 필수입니다.")
    private String authDomain;
}
