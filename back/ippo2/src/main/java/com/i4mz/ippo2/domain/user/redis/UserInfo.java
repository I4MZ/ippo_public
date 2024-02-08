package com.i4mz.ippo2.domain.user.redis;

import lombok.Data;

@Data
public class UserInfo {
    private String accessToken;
    private String refreshToken;
    private String email;
}
