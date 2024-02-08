package com.i4mz.ippo2.global.util;

import com.i4mz.ippo2.domain.user.dto.ChildrenResponseDto;
import com.i4mz.ippo2.domain.user.dto.UserResponseDto;
import com.i4mz.ippo2.domain.user.entity.Children;
import com.i4mz.ippo2.domain.user.entity.User;

public class ConvertUtil {

    private ConvertUtil() {
        // 유틸리티 클래스이므로 인스턴스화 방지
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static UserResponseDto convertToUserResponseDto(User user) {
        UserResponseDto userDto = new UserResponseDto();
        userDto.setUserEmail(user.getUserEmail());
        userDto.setPhoneNum(user.getPhoneNum());
        return userDto;
    }

    public static ChildrenResponseDto convertToChildResponseDto(Children child) {
        ChildrenResponseDto childDto = new ChildrenResponseDto();
        childDto.setChildName(child.getChildName());
        childDto.setChildBirthDate(child.getChildBirthDate());
        childDto.setGender(child.getGender());
        return childDto;
    }
}
