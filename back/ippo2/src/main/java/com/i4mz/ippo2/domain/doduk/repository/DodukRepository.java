package com.i4mz.ippo2.domain.doduk.repository;

import com.i4mz.ippo2.domain.doduk.entity.Doduk;
import com.i4mz.ippo2.domain.doduk.entity.DodukBooksKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DodukRepository extends JpaRepository<Doduk, Long> {
    Optional<Doduk> findById(DodukBooksKey id);
}
