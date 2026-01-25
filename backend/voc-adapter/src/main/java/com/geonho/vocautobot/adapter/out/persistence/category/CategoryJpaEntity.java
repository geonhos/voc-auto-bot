package com.geonho.vocautobot.adapter.out.persistence.category;

import com.geonho.vocautobot.domain.category.CategoryType;
import com.geonho.vocautobot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CategoryJpaEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 10)
    private CategoryType type;

    @Column(name = "parent_id")
    private Long parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private CategoryJpaEntity parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CategoryJpaEntity> children = new ArrayList<>();

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public CategoryJpaEntity(String name, CategoryType type, Long parentId, String description,
                             boolean isActive, int sortOrder) {
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.description = description;
        this.isActive = isActive;
        this.sortOrder = sortOrder;
    }

    public void update(String name, String description, boolean isActive, int sortOrder) {
        if (name != null) {
            this.name = name;
        }
        this.description = description;
        this.isActive = isActive;
        if (sortOrder > 0) {
            this.sortOrder = sortOrder;
        }
    }
}
