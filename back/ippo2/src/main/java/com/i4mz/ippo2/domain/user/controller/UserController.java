package com.i4mz.ippo2.domain.user.controller;

/*
Controller: MVC 패턴의 'Controller' 부분으로, HTTP 요청을 받고 응답을 반환하는 역할을 합니다.
사용자의 입력을 처리하고, 그에 따라 모델을 호출하거나 결과를 보여주기 위한 뷰를 선택합니다.
 */

import com.i4mz.ippo2.domain.books.dto.StoryBookDto;
import com.i4mz.ippo2.domain.user.dto.ChildrenDto;
import com.i4mz.ippo2.domain.user.dto.UserRegistrationDto;
import com.i4mz.ippo2.domain.user.dto.UserResponseDto;
import com.i4mz.ippo2.domain.user.dto.UserUpdatedDto;
import com.i4mz.ippo2.domain.user.entity.Children;
import com.i4mz.ippo2.domain.user.entity.User;
import com.i4mz.ippo2.domain.user.service.ChildrenService;
import com.i4mz.ippo2.domain.user.service.UserService;
import com.i4mz.ippo2.domain.user.redis.UserInfo;
import com.i4mz.ippo2.global.util.ConvertUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    /*
     @Autowired 어노테이션을 사용하지 않고 private final UserService userService;로 의존성 주입을 구현하는 것은 사실 더 권장되는 방법입니다.
     이 방식을 "생성자 주입(Constructor Injection)"이라고 합니다.
     생성자 주입은 클래스의 의존성이 명확하고, 변경되지 않으며, 테스트하기 쉬운 코드를 작성하는 데 도움이 됩니다.
     */
    private final UserService userService;
    private final ChildrenService childrenService;


    // 로그인 후 Redis에 토큰, 정보 입력(로그인)
    @PostMapping("/login")
    public void userAddToRedis (@RequestBody UserInfo userInfo) {
        userService.saveUserToRedis(userInfo.getAccessToken(), userInfo.getRefreshToken(), userInfo.getEmail());

    }
    // Redis 조회하여 값이 있는지 확인(로그인 상태 확인)
    @PostMapping("/isLoggedInCheck")
    public ResponseEntity<String> getUserFromRedis() {
        String accessToken = userService.getUserFromRedis();
        return ResponseEntity.ok(accessToken);
    }

    // Redis 에 저장된 회원의 정보를 삭제 (로그아웃)
    @PostMapping("/logout")
    public void userRemoveToRedis() {
        userService.removeUserFromRedis();
    }

    // 회원 이메일로 회원 정보 조회
    @GetMapping("/{userEmail}")
    public ResponseEntity<UserResponseDto> getUserByEmail(@PathVariable("userEmail") String user_email, HttpServletRequest httpServletRequest){
        User user = userService.getUser(user_email);

        if (user == null) {
            // 검색결과가 없으면 null을 반환
            return null;
        } else {
            return ResponseEntity.ok(ConvertUtil.convertToUserResponseDto(user));
        }
    }


    // 회원 가입
    @PostMapping("/join")
    public ResponseEntity<UserResponseDto> registerUser(@Valid @RequestBody UserRegistrationDto userDto) {
        User user = userService.registerUser(userDto);
        return ResponseEntity.ok(ConvertUtil.convertToUserResponseDto(user));
    }
    // 회원 정보 수정
    @PutMapping("/{userEmail}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable String userEmail, @RequestBody UserUpdatedDto updateDto) {
        User updatedUser = userService.updateUser(userEmail, updateDto);
        return ResponseEntity.ok(ConvertUtil.convertToUserResponseDto(updatedUser));
    }
    // 회원 삭제
    @DeleteMapping("/{userEmail}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userEmail) {
        userService.deleteUser(userEmail);
        return ResponseEntity.ok().build();
    }


    // User의 email로 모든 자녀를 받는 API
    @GetMapping("/children/{userEmail}")
    public ResponseEntity<List<Children>> getAllChildrenByUserEmail(@PathVariable String userEmail) {
        List<Children> childrenList = childrenService.getAllChildrenByUserEmail(userEmail);

        return ResponseEntity.ok(childrenList);
    }

    // User의 email로 자녀를 추가하는 API
    @PostMapping("/children/{userEmail}")
    public ResponseEntity<Children> addChildToUser(@PathVariable String userEmail, @Valid @RequestBody ChildrenDto childDto) {
        Children child = convertDtoToEntity(childDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(childrenService.addChildToUser(userEmail, child));
    }

    private Children convertDtoToEntity(ChildrenDto childDto) {
        return Children.builder()
                .childName(childDto.getChildName())
                .childBirthDate(childDto.getChildBirthDate())
                .gender(childDto.getGender())
                .build();
    }
}