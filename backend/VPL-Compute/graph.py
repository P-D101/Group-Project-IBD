class Graph:
    def __init__(self, connections):
        self.out_set = self.out_edge_list(connections)
        self.in_set = self.in_edge_list(connections)

    def out_edge_list(self, connections):
        list = {}
        for connection in connections:
            if list.get(connection[0]) == None:
                list[connection[0]] = [connection[1]]
            else:
                list[connection[0]].append(connection[1])
        return list

    def in_edge_list(self, connections):
        list = {}
        for connection in connections:
            if list.get(connection[1]) == None:
                list[connection[1]] = [connection[0]]
            else:
                list[connection[1]].append(connection[0])
        return list

    def remove_edge(self, edge_start, edge_end):
        self.out_set[edge_start].remove(edge_end)
        self.in_set[edge_end].remove(edge_start)

    def DAG_sort(self, start_nodes):
        print(self.out_set, self.in_set)
        sorted_order = []
        nodes = start_nodes.copy()
        while len(nodes) > 0:
            node = nodes.pop()
            sorted_order.append(node)
            try:
                for output_node in self.out_set[node][:]:
                    self.remove_edge(node, output_node)
                    if len(self.in_set[output_node]) == 0:
                        nodes.append(output_node)
            except:
                pass

        return sorted_order


if __name__ == '__main__':
    connections = [
        [0, 2],
        [1, 2],
        [1, 3],
        [0, 3],
        [2, 4],
        [3, 5]
    ]

    graph = Graph(connections)

    print(graph.DAG_sort([0,1]))