package com.i4mz.ippo2.domain.user.service;

/*
Service: 비즈니스 로직을 수행하는 계층입니다.
Controller로부터 데이터를 받아 Repository를 통해 데이터베이스와 상호작용하고, 비즈니스 규칙에 따라 데이터를 처리합니다.
Service는 일반적으로 Transactional 어노테이션을 사용하여 데이터의 일관성과 무결성을 보장합니다.
 */

import com.i4mz.ippo2.domain.user.dto.UserRegistrationDto;
import com.i4mz.ippo2.domain.user.dto.UserUpdatedDto;
import com.i4mz.ippo2.domain.user.entity.User;
import com.i4mz.ippo2.domain.user.repository.UserRepository;
import com.i4mz.ippo2.global.exception.UserNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final RedisTemplate<String, String> redisTemplate;

    public User registerUser(UserRegistrationDto userDto){
        User user = new User();
        user.setUserEmail(userDto.getUserEmail());
        user.setPhoneNum(userDto.getPhoneNum());
        user.setAuthToken(userDto.getAuthToken());
        user.setAuthDomain(userDto.getAuthDomain());
        return userRepository.save(user);
    }

    public User getUser(String user_email) {
        return userRepository.findUserByUserEmail(user_email).orElse(null);
//                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
    public User updateUser(String userEmail, UserUpdatedDto userDto) {
        User user = userRepository.findUserByUserEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // 사용자 정보 업데이트 로직
        user.setPhoneNum(userDto.getPhoneNum());
        return userRepository.save(user);
    }

    public void deleteUser(String userEmail) { userRepository.deleteById(userEmail);}


    // 레디스에 24시간 회원정보를 저장(토큰, 이메일)
    @Transactional
    public void saveUserToRedis(String accessToken, String refreshToken, String email) {

        redisTemplate.opsForValue().set("accessToken", accessToken, 360, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set("refreshToken", refreshToken, 360, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set("email", email, 360, TimeUnit.MINUTES);
    }

    // 레디스에 회원 값이 존재하는지 확인
    public String getUserFromRedis() {
        return redisTemplate.opsForValue().get("accessToken");
    }

    public void removeUserFromRedis() {
        redisTemplate.delete("accessToken");
        redisTemplate.delete("refreshToken");
        redisTemplate.delete("email");
    }
}
