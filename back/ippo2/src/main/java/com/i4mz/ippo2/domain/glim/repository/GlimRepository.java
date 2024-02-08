package com.i4mz.ippo2.domain.glim.repository;

import com.i4mz.ippo2.domain.glim.entity.GlimEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlimRepository extends JpaRepository<GlimEntity, Integer> {
    Optional<GlimEntity> findById(Integer bookId);

    List<GlimEntity> findAll();

    GlimEntity save(GlimEntity glimEntity);

    void deleteById(Integer bookId);

    void delete(GlimEntity glimEntity);
}