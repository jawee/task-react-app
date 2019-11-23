import React from 'react';
import ReactDOM from 'react-dom';
import '@atlaskit/css-reset';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
//import initialData from './initial-data';
import Column from './column';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
`;

class InnerList extends React.PureComponent {
    render() {
        const { column, taskMap, index} = this.props;
        const tasks = column.taskIds.map(taskId => taskMap[taskId]);
        return <Column column={column} tasks={tasks} index={index} />;
    }
    componentDidUpdate() {
        // fetch('http://api.nuc.local/columns/' + this.props.columnId, { method: 'delete', body: JSON.stringify({taskIds: column.taskIds}) }).then(response => response.json())
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tasks: [], columns: [], columnOrder: []};
    }
    componentDidMount() {
        fetch('http://api.nuc.local/tasks').then(res => res.json()).then(data => {
            this.setState({tasks: data});
        }).catch(console.log);

        fetch('http://api.nuc.local/columns').then(res => res.json()).then(data => {
            this.setState({columns: data});
        }).catch(console.log);

        fetch('http://api.nuc.local/columnOrder').then(res => res.json()).then(data => {
            this.setState({columnOrder: data});
        }).catch(console.log);
    }

    //state = initialData;

    onDragEnd = result => {
        const { destination, source, draggableId, type } = result;
        if(!destination) {
            return;
        }

        if(destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        if (type === 'column') {
            const newColumnOrder = Array.from(this.state.columnOrder);
            newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, draggableId);

            const newState = {
                ...this.state,
                columnOrder: newColumnOrder,
            };
            this.setState(newState);
            return;
        }

        const start = this.state.columns[source.droppableId];
        const finish = this.state.columns[destination.droppableId];

        if(start === finish) {
            const newTaskIds = Array.from(start.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);
    
            const newColumn = {
                ...start,
                taskIds: newTaskIds,
            };
    
            const newState = {
                ...this.state,
                columns: {
                    ...this.state.columns,
                    [newColumn.id]: newColumn,
                },
            };
    
            this.setState(newState);
            return;
        }

        // MOving from one list to another
        const startTaskIds = Array.from(start.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStart = {
            ...start,
            taskIds: startTaskIds,
        };

        const finishTaskIds = Array.from(finish.taskIds);
        finishTaskIds.splice(destination.index, 0, draggableId);
        const newFinish = {
            ...finish,
            taskIds: finishTaskIds,
        };

        const newState = {
            ...this.state,
            columns:{
                ...this.state.columns,
                [newStart.id]: newStart,
                [newFinish.id]: newFinish,
            },
        };

        this.setState(newState);
        return;
        
    };

    render() {
        return (
        <DragDropContext 
            onDragEnd={this.onDragEnd}
        >
            <Droppable droppableId="all-columns" direction="horizontal" type="column">
                {provided => (
                    <Container
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {this.state.columnOrder.map((columnId, index) => {
                        const column = this.state.columns[columnId];
                        return (<InnerList key={column.id} column={column} taskMap={this.state.tasks} index={index}/>
                        );
                        })}
                    </Container>
                )}
            </Droppable>
            
        </DragDropContext>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));

