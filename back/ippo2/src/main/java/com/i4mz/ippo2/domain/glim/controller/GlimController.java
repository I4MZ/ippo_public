package com.i4mz.ippo2.domain.glim.controller;

import com.i4mz.ippo2.domain.glim.entity.GlimEntity;
import com.i4mz.ippo2.domain.glim.service.GlimService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book/glim")
public class GlimController {
    private final GlimService glimService;

    public GlimController(GlimService glimService){
        this.glimService = glimService;
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<GlimEntity> getGlimContentById(@PathVariable Integer bookId) {
        GlimEntity glimEntity = glimService.findById(bookId);
        return ResponseEntity.ok().body(glimEntity);
    }

    @GetMapping("/")
    public ResponseEntity<List<GlimEntity>> getAllGlimContents() {
        List<GlimEntity> list = glimService.findAll();
        return ResponseEntity.ok().body(list);
    }

    @PostMapping("/")
    public ResponseEntity<GlimEntity> createGlimContent(@RequestBody GlimEntity glimEntity) {
        GlimEntity createdGlimEntity = glimService.save(glimEntity);
        return ResponseEntity.ok().body(createdGlimEntity);
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<GlimEntity> updateGlimContent(@PathVariable Integer bookId, @RequestBody GlimEntity glimEntityDetails) {
        GlimEntity updatedGlimEntity = glimService.update(bookId, glimEntityDetails);
        return ResponseEntity.ok().body(updatedGlimEntity);
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> deleteGlimContent(@PathVariable Integer bookId) {
        glimService.deleteById(bookId);
        return ResponseEntity.ok().build();
    }
}