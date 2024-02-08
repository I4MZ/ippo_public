package com.i4mz.ippo2.domain.user.controller;

import com.i4mz.ippo2.domain.user.dto.ChildrenDto;
import com.i4mz.ippo2.domain.user.dto.ChildrenResponseDto;
import com.i4mz.ippo2.domain.user.entity.Children;
import com.i4mz.ippo2.domain.user.service.ChildrenService;
import com.i4mz.ippo2.global.util.ConvertUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildrenController {

    private final ChildrenService childrenService;

    // 자녀 ID로 정보 조회
    @GetMapping("/{childId}")
    public ResponseEntity<ChildrenResponseDto> getChildrenById(@PathVariable Integer childId) {
        Children child = childrenService.getChildrenById(childId);
        return ResponseEntity.ok(ConvertUtil.convertToChildResponseDto(child));
    }
    // 자녀 ID로 정보 수정
    @PutMapping("/{childId}")
    public ResponseEntity<ChildrenResponseDto> updateChild(@PathVariable Integer childId, @Valid @RequestBody ChildrenDto updateDto) {
        Children child = childrenService.updateChild(childId, updateDto);
        return ResponseEntity.ok(ConvertUtil.convertToChildResponseDto(child));
    }
    // 자녀 ID로 자녀 정보 삭제
    @DeleteMapping("/{childId}")
    public ResponseEntity<Children> deleteChild(@PathVariable Integer childId) {
        childrenService.deleteChild(childId);
        return ResponseEntity.ok().build();
    }

    // DTO 변환 로직을 필요에 따라 구현하십시오.
    private Children convertDtoToEntity(ChildrenDto childDto) {
        return Children.builder()
                .childName(childDto.getChildName())
                .childBirthDate(childDto.getChildBirthDate())
                .gender(childDto.getGender())
                .build();
    }
}
