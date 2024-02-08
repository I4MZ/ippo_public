package com.i4mz.ippo2.domain.user.service;

import com.i4mz.ippo2.domain.user.dto.ChildrenDto;
import com.i4mz.ippo2.global.exception.ChildNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import com.i4mz.ippo2.domain.user.entity.Children;
import com.i4mz.ippo2.domain.user.entity.User;
import com.i4mz.ippo2.domain.user.repository.ChildrenRepository;
import com.i4mz.ippo2.domain.user.repository.UserRepository;

import java.util.List;
@Service
@Transactional
@RequiredArgsConstructor
public class ChildrenService {

    private final ChildrenRepository childrenRepository;
    private final UserRepository userRepository;

    public List<Children> getAllChildrenByUserEmail(String userEmail) {
        return childrenRepository.findByUser_UserEmail(userEmail);
    }

    public Children getChildrenById(Integer childId) {
        return findChildById(childId);
    }

    public Children addChildToUser(String userEmail, Children child) {
        User user = userRepository.findById(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        child.setUser(user);
        return childrenRepository.save(child);
    }

    public Children updateChild(Integer childId, ChildrenDto updateDto) {
        Children child = findChildById(childId);
        child.setChildName(updateDto.getChildName());
        child.setChildBirthDate(updateDto.getChildBirthDate());
        child.setGender(updateDto.getGender());
        return childrenRepository.save(child);
    }

    public void deleteChild(Integer childId) {
        childrenRepository.deleteById(childId);
    }

    private Children findChildById(Integer childId) {
        return childrenRepository.findById(childId)
                .orElseThrow(() -> new ChildNotFoundException("Child not found"));
    }

}


