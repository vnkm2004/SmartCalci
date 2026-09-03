package com.smartcalc.service;

import com.smartcalc.model.HistoryItem;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class HistoryService {

    private final Deque<HistoryItem> historyDeque = new ConcurrentLinkedDeque<>();
    private static final int MAX_HISTORY = 100;

    public HistoryItem add(HistoryItem item) {
        if (item == null) return null;
        historyDeque.addFirst(item);
        while (historyDeque.size() > MAX_HISTORY) {
            historyDeque.removeLast();
        }
        return item;
    }

    public List<HistoryItem> getAll() {
        return new ArrayList<>(historyDeque);
    }

    public boolean delete(String id) {
        return historyDeque.removeIf(item -> Objects.equals(item.getId(), id));
    }

    public void clear() {
        historyDeque.clear();
    }
}
