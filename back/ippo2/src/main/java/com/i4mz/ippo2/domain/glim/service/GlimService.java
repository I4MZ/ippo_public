package com.i4mz.ippo2.domain.glim.service;

import com.i4mz.ippo2.domain.glim.entity.GlimEntity;
import com.i4mz.ippo2.domain.glim.repository.GlimRepository;
import com.i4mz.ippo2.global.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class GlimService {

    private final GlimRepository glimRepository;

    public GlimService(GlimRepository glimRepository) {
        this.glimRepository = glimRepository;
    }

    public GlimEntity findById(Integer bookId){
        return glimRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("GlimContent not found with id " + bookId));
    }

    public List<GlimEntity> findAll() {
        return glimRepository.findAll();
    }

    public GlimEntity save(GlimEntity glimEntity){
        return glimRepository.save(glimEntity);
    }

    public GlimEntity update(Integer bookId, GlimEntity glimUpdatedEntity){
        GlimEntity glimEntity = findById(bookId);

        glimEntity.setWriterContents(glimUpdatedEntity.getWriterContents());
        glimEntity.setCheckDone(glimUpdatedEntity.getCheckDone());
        glimEntity.setErData(glimUpdatedEntity.getErData());
        glimEntity.setResultData(glimUpdatedEntity.getResultData());

        return glimRepository.save(glimEntity);
    }

    public void deleteById(Integer bookId) {
        GlimEntity glimEntity = findById(bookId); // Throws exception if not found
        glimRepository.delete(glimEntity);
    }
}
